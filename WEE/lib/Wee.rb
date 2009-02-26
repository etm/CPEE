class Wee
  
  def initialize
    # Attetion, overwritten see wee_initialize
    @search = false
    @search_position = nil
  end

  def self::wee_initialize
    send :define_method, :initialize do
      initialize_search if methods.include?('initialize_search')
      initialize_context if methods.include?('initialize_context')
      
      @search = @__wee_search
      @search_position = @__wee_positions
      @__wee_threads = Array.new;
      
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
    define_method :initialize_context do
      variables.each do |name, value|
        instance_variable_set(("@" + name.to_s).to_sym,value)
      end
    end
    wee_initialize
  end

  protected 
    def activity(position, type, endpoint=nil,*parameters, &block)
      # set semaphore to avoid conflicts if @search is changed by another thread
      if is_in_search_mode(position)
        return
      end
      
      begin
        case type
          when :manipulate
            yield if block
          when :call
            to_return = handle_call endpoint, parameters
            # call finished_call until myhandler finished the handle_call
            yield(to_return) if block;
        else
          raise "Invalid activity type #{type}. Only :manipulate or :call allowed"
        end
        
      rescue => err
        inform_activity_failed position, err
      end
      
      inform_activity_done position
    end

    def parallel(type=:wait)
      @__wee_threads = Array.new
      mythreads = Array.new
      
      # Handle the yield block in a Mutex to resolve conflicts 
      #   (waiting for branches) in nested parallel blocks
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
  public
    def stop()
     # TODO
     # all Threads to .stop
     # all Myhandler.handle_call auf stop
    end
end    