require 'weel'

class AttributesHelper
  def translate(__attributes__,__dataelements__,__endpoints__)
    @data       = WEEL::ReadHash.new(__dataelements__)
    @endpoints  = WEEL::ReadHash.new(__endpoints__)
    @attributes = WEEL::ReadHash.new(__attributes__)
    __attributes__.transform_values do |v|
      v.gsub(/(!(attributes|data|endpoints)\.[\w_]+)/) do |m|
        eval(m[1..-1])
      end
    end
  end

  def data
    @data
  end

  def endpoints
    @endpoints
  end

  def attributes
    @attributes
  end
end

