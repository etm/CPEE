class Wee
  
  def initialize
    # Attention (!!!), redefined, see wee_initialize
    @search = false
    @search_position = nil
  end
  def self::wee_initialize
    send :define_method, :initialize do
      @__wee_context = Hash.new
      initialize_search if methods.include?('initialize_search')
      initialize_context if methods.include?('initialize_context')
      
      @search = @__wee_search
      @search_position = @__wee_positions
      @__wee_threads = Array.new;
      @__wee_endstatus = :normal

      $LOG = Logger.new(STDOUT) unless defined? $LOG
    end
  end
  def self::search(wee_search,wee_positions=[])
    define_method :initialize_search do
      @__wee_search = wee_search
      if wee_positions.is_a?(Array)
        @__wee_positions = wee_positions
      else
        @__wee_positions = Array.new
        @__wee_positions << wee_positions
      end
    end
    wee_initialize
  end
  def self::endpoint(endpoints)
    endpoints.each do |name,value|
      define_method name do
        return value
      end
    end
  end
  def self::context(variables)
    # define method to get context
    define_method :context do
      return @__wee_context
    end 

    # translate context into instance variables
    define_method :initialize_context do
      unless @__wee_context
        @__wee_context = Hash.new
      end
      variables.each do |name, value|
        instance_variable_set(("@" + name.to_s).to_sym,value)
        @__wee_context[("@" + name.to_s).to_sym] = value
      end
    end
    wee_initialize
  end
  def self::endstatus(status)
    @__wee_endstatus = status;
    define_method :endstatus do |*optionalStatus|
      newStatus = *optionalStatus
      if newStatus
        @__wee_endstatus = newStatus
      end
      return @__wee_endstatus  
    end
  end
  
  protected 
    def activity(position, type, endpoint=nil,*parameters, &block)
      if endstatus == :stopped
        $LOG.debug('Wee.activity') {"Execution is stopped => #{position} is ommitted => returning"}
      end
      if endstatus == :stopped || is_in_search_mode(position)
        return
      end
      handler = create_handler
      begin
        case type
          when :manipulate
            yield if block
          when :call
            # handshake call and wait until it finisheds
            handler.handle_call endpoint, parameters
            until handler.finished_call() || endstatus == :stopped
              Thread.pass
            end 
            
            unless endstatus == :stopped
              to_return = handler.return_value
              yield(to_return) if block
              refreshcontext
              handler.inform_activity_done position, context if endstatus != :stopped
            else
              handler.stop_call
            end
        else
          raise "Invalid activity type #{type}. Only :manipulate or :call allowed"
        end
      rescue => err
        refreshcontext
        handler.inform_activity_failed position, context, err
      end
    end
    def parallel(type=:wait)
      @__wee_threads = Array.new
      mythreads = Array.new
      
      # Handle the yield block (= def of parallel branches) in a 
      # Mutex to resolve conflicts (waiting for branches) in 
      # nested parallel blocks
      semaphore = Mutex.new
      semaphore.synchronize { 
        yield #(pid)
        mythreads = @__wee_threads.clone
      }
      
      
      if type == :wait # Wait for each branch to join
        mythreads.each { |thread| thread.join } 
      else # wait until at least 1 thread(=branch) finished
        allthreadsrunning = true 
        while allthreadsrunning 
          mythreads.each { |thread|  allthreadsrunning = false unless thread.alive?}
          Thread.pass;
        end
      end
    end
    def parallel_branch
      @__wee_threads << Thread.new do
        Thread.current[:branch_search] = @search
        yield
      end
    end
    
  private
    def is_in_search_mode(position)
      # set semaphore to avoid conflicts if @search is changed by another thread
      semaphore = Mutex.new
      semaphore.synchronize { 
        branch = Thread.current;
        if @search_position.member?(position) # matching searchposition => start execution from here
          $LOG.debug("Wee.activity") {"position #{position} found, processing branch from here"}
          branch[:branch_search] = false;
          @search = false;
        end
        if branch[:branch_search] || @search # is activity part of a branch and in search mode?
          $LOG.debug("Wee.activity") {"omitting #{position}, this branch is still in search mode"}
          return true;
        end
      }
      return false;
    end
    def refreshcontext()
      @__wee_context.each { |varname, value| 
        @__wee_context[varname] = instance_variable_get(varname)
      }
    end
    
  public
    def stop()
      $LOG.debug('Wee.stop') {"Execution of Workflow will be stopped"}
      @__wee_endstatus = :stopped
    end
end